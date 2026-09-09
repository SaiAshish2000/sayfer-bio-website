"""
Delete every color attribute except final_vc (the leftover "ao" attribute from
the very first pipeline attempt, plus the intermediate basecolor_vc/ao_vc used
only to compute final_vc, were all still present -- glTF export was writing
all four as COLOR_0..COLOR_3, and three.js's GLTFLoader only ever reads
COLOR_0, which happened to be the stale leftover "ao" attribute instead of
the intended final_vc). Keeping exactly one color attribute makes it
unambiguously COLOR_0.
"""
import bpy

WORK_PATH = r"D:\Projects\sayfer-bio\assets\blender\sayfer-scaffold-v2-bake-work.blend"
OUT_GLB = r"D:\Projects\sayfer-bio\public\models\sayfer-scaffold-v2.glb"

bpy.ops.wm.open_mainfile(filepath=WORK_PATH)
lp = bpy.data.objects["Scaffold_LP"]

print("color attributes before:", [a.name for a in lp.data.color_attributes])
for name in ("ao", "basecolor_vc", "ao_vc"):
    attr = lp.data.color_attributes.get(name)
    if attr:
        lp.data.color_attributes.remove(attr)
print("color attributes after:", [a.name for a in lp.data.color_attributes])

final_attr = lp.data.color_attributes["final_vc"]
lp.data.attributes.active_color = final_attr
lp.data.color_attributes.render_color_index = lp.data.color_attributes.find("final_vc")

bpy.ops.wm.save_as_mainfile(filepath=WORK_PATH)
print("SAVED", WORK_PATH)

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
    export_draco_color_quantization=10,
)
print("EXPORTED", OUT_GLB)
print("DONE_CLEAN_EXPORT")
