"""
Step 5: increase cavity/exterior separation in the baked vertex colors.

The existing final_vc = OLD_BASE * ao (linear AO straight from the bake). A
linear AO compresses contrast from both ends: exposed walls get dulled toward
mid-tone while deep cavities never get properly dark. The approved R3 render
instead shows BRIGHT gold walls against DISTINCTLY dark pore interiors.

So: recover ao from final_vc (it was a pure multiply, so ao = final.r/OLD_BASE.r),
apply a gamma curve ao^AO_GAMMA (>1 leaves ao~1 essentially untouched and pushes
the low/mid range down), and re-multiply by a slightly brighter, still-warm
ochre base. Exteriors get brighter, cavities get deeper -- no flat global
darkening.
"""
import bpy

WORK_PATH = r"D:\Projects\sayfer-bio\assets\blender\sayfer-scaffold-v2-bake-work.blend"
OUT_GLB = r"D:\Projects\sayfer-bio\public\models\sayfer-scaffold-v2.glb"

OLD_BASE_R = 0.6          # red channel of the base color final_vc was built with
NEW_BASE = (0.70, 0.455, 0.095)  # linear; warm ochre, a touch brighter than before
AO_GAMMA = 1.45           # >1 deepens cavities, leaves fully-exposed walls alone

bpy.ops.wm.open_mainfile(filepath=WORK_PATH)
lp = bpy.data.objects["Scaffold_LP"]

final_attr = lp.data.color_attributes["final_vc"]
n = len(final_attr.data)
r, g, b = NEW_BASE

lo = mid = hi = 0
for i in range(n):
    ao = final_attr.data[i].color[0] / OLD_BASE_R
    if ao > 1.0:
        ao = 1.0
    ao = ao ** AO_GAMMA
    final_attr.data[i].color = (r * ao, g * ao, b * ao, 1.0)
    if ao < 0.25:
        lo += 1
    elif ao < 0.7:
        mid += 1
    else:
        hi += 1

print(f"AO after gamma {AO_GAMMA}: deep(<0.25)={lo/n:.1%} mid={mid/n:.1%} lit(>0.7)={hi/n:.1%}")

lp.data.attributes.active_color = final_attr
lp.data.color_attributes.render_color_index = lp.data.color_attributes.find("final_vc")
bpy.ops.wm.save_as_mainfile(filepath=WORK_PATH)

bpy.ops.object.select_all(action="DESELECT")
lp.select_set(True)
bpy.context.view_layer.objects.active = lp
bpy.ops.export_scene.gltf(
    filepath=OUT_GLB,
    export_format="GLB",
    use_selection=True,
    export_apply=True,
    export_yup=True,
    export_normals=True,
    export_texcoords=False,
    export_tangents=False,
    export_materials="PLACEHOLDER",
    export_vertex_color="ACTIVE",
    export_active_vertex_color_when_no_material=True,
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
    export_draco_position_quantization=14,
    export_draco_normal_quantization=10,
    export_draco_color_quantization=12,
)
print("EXPORTED", OUT_GLB)
print("DONE_STEP5")
